// UserState Durable Object
// Storage keys: profile, accuracy, gw:{N}:chat, gw:{N}:predictions
// TODO: Phase 2 implementation

export class UserState {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    return new Response('UserState DO');
  }
}
