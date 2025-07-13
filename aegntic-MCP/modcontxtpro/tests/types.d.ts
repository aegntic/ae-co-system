declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R;
    }
  }
}

export {};