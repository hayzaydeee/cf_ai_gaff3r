// Worker entry point — router and request handling
// TODO: Phase 2 implementation
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('Gaff3r Worker');
  },
};

export { UserState } from './durable-objects/user-state';
