import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import * as bcrypt from 'bcrypt';
import { NEO4J_DRIVER } from '../database/database.module';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Omit<Admin, 'password'>> {
    const session = this.driver.session();
    try {
      // Check if admin already exists
      const existingAdmin = await session.run(
        'MATCH (a:Admin {username: $username}) RETURN a',
        { username: createAdminDto.username }
      );

      if (existingAdmin.records.length > 0) {
        throw new ConflictException('Admin username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

      // Create admin
      const result = await session.run(
        `CREATE (a:Admin {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $password,
          createdAt: datetime()
        })
        RETURN a`,
        {
          username: createAdminDto.username,
          email: createAdminDto.email,
          password: hashedPassword,
        }
      );

      const adminNode = result.records[0].get('a').properties;
      const { password, ...adminWithoutPassword } = adminNode;
      return adminWithoutPassword;
    } finally {
      await session.close();
    }
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Admin {username: $username}) RETURN a',
        { username }
      );

      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('a').properties as Admin;
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<Omit<Admin, 'password'> | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Admin {id: $id}) RETURN a',
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const adminNode = result.records[0].get('a').properties;
      const { password, ...adminWithoutPassword } = adminNode;
      return adminWithoutPassword;
    } finally {
      await session.close();
    }
  }
}
