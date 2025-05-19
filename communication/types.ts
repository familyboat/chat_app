export interface UserView {
  name: string;
  avatarUrl: string;
}

export interface MessageView {
  message: string;
  from: UserView;
  createdAt: string;
}
