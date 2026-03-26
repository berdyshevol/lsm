import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseModule } from './course-module.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column()
  moduleId!: string;

  @ManyToOne(() => CourseModule, (module) => module.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_id' })
  module!: CourseModule;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
