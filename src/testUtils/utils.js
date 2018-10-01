export const withDelay = (delay = 0) =>
  new Promise(resolve => setTimeout(() => resolve(), delay));

export const fakeEvent = id => ({
  target: {
    parentElement: {
      parentElement: {
        dataset: {
          id
        }
      }
    }
  }
});
