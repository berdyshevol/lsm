/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser: User = {
    id: 'uuid-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.Student,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockUser),
    };

    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const { password: _, ...userWithoutPassword } = mockUser;
      repository.findOne!.mockResolvedValue(
        userWithoutPassword as unknown as User,
      );

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(userWithoutPassword);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user with password field', async () => {
      const result = await service.findByEmailWithPassword('test@example.com');
      expect(result).toEqual(mockUser);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const createDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed-password',
      };
      repository.create!.mockReturnValue({
        ...mockUser,
        ...createDto,
      } as User);
      repository.save!.mockResolvedValue({
        ...mockUser,
        ...createDto,
      } as User);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by createdAt DESC without updatedAt', async () => {
      const users = [mockUser];
      (repository.find as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll();
      const { updatedAt, ...expectedUser } = mockUser;
      expect(result).toEqual([expectedUser]);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-123');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateRole', () => {
    it('should update and return the user with the new role without updatedAt', async () => {
      const updatedUser = { ...mockUser, role: UserRole.Instructor };
      repository.findOne!.mockResolvedValue(mockUser);
      repository.save!.mockResolvedValue(updatedUser as User);

      const result = await service.updateRole('uuid-123', UserRole.Instructor);
      expect(result.role).toBe(UserRole.Instructor);
      expect(result).not.toHaveProperty('updatedAt');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateRole('nonexistent', UserRole.Admin),
      ).rejects.toThrow('User not found');
    });
  });
});
