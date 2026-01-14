exports.main = async function (event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify(`hello I cam read from ${process.env.TABLE_NAME}`),
  };
};
