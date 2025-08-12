import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { NotificationTypeEnum } from '@domain/entities/notification.entity'

import { User } from './user.entity'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    primaryKeyConstraintName: 'PK_notifications_id',
  })
  public readonly id!: number

  @Column({ type: 'int', name: 'user_id' })
  public userId!: number

  @Column({
    type: 'smallint',
    enum: NotificationTypeEnum,
  })
  public type!: NotificationTypeEnum

  @Column({ type: 'varchar', length: 255 })
  public title!: string

  @Column({ type: 'text' })
  public message!: string

  @Column({ type: 'jsonb', nullable: true })
  public data!: object

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  public isRead!: boolean

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  public readAt!: Date

  @CreateDateColumn({ name: 'created_at' })
  public readonly createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  public readonly updatedAt!: Date

  // Relations
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  public user!: User
}
