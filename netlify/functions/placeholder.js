// 占位函数，不含任何依赖
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "占位函数" })
  };
}; 