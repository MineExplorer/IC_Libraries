function createBlockSource(dimension = 0) {
  return {
    getDimension() {
      return dimension;
    }
  };
}

module.exports = { createBlockSource };
