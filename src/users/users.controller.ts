import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdir } from 'fs';
import { GetUser } from '../common/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { SafeUser } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { FilesService } from '../files/files.service';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

type UploadedProfileImage = {
  readonly filename: string;
  readonly mimetype: string;
  readonly size: number;
  readonly originalname: string;
};

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @Get('me')
  async getMe(@GetUser() user: SafeUser) {
    const fresh = await this.usersService.findById(user.id);
    return this.usersService.toSafeUser(fresh ?? user);
  }

  @Patch('me')
  async updateMe(@GetUser('id') userId: string, @Body() dto: UpdateMeDto) {
    const updated = await this.usersService.updateUser(userId, dto);
    return this.usersService.toSafeUser(updated);
  }

  @Post('me/profile-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PNG or JPEG image not larger than 5MB.',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const user = req.user as SafeUser;
          const uploadPath = join(process.cwd(), 'uploads', user.id);
          mkdir(uploadPath, { recursive: true }, (err) => cb(err ?? null, uploadPath));
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname) || '.png';
          cb(null, `profile-${Date.now()}${extension}`);
        },
      }),
    }),
  )
  async uploadProfileImage(
    @GetUser() user: SafeUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PROFILE_IMAGE_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g)$/i }),
        ],
      }),
    )
    file: UploadedProfileImage,
  ) {
    await this.filesService.removeFileByUrl(user.profileImageUrl);
    const publicUrl = this.filesService.buildProfileImageUrl(user.id, file.filename);
    const updated = await this.usersService.updateUser(user.id, {
      profileImageUrl: publicUrl,
    });
    return this.usersService.toSafeUser(updated);
  }
}
