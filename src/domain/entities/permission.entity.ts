/**
 * Available actions that can be performed on resources
 */
export type TAction =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'search'
/**
 * Available subjects (resources) in the system
 */
export type TSubject =
  | 'all'
  | 'Task'
  | 'User'
  | 'Service'
  | 'Appointment'
  | 'Promotion'
  | 'Notification'
  | 'Category'
  | 'Review'
  | 'ServiceFavorite'
  | 'Client'
  | 'Provider'
  | 'ProviderProfile'
  | 'Payment'
  | 'Invoice'
