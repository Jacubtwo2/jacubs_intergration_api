import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1716400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '254',
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '180',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'profileImageUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'refreshTokenHash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'users_email_unique',
        columnNames: ['email'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'users_email_unique');
    await queryRunner.dropTable('users');
  }
}
