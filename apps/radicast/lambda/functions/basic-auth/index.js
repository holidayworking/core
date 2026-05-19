import cf from "cloudfront";

const kvsId = "KVS_ID";

const kvsHandle = cf.kvs(kvsId);

// oxlint-disable-next-line no-unused-vars
async function handler(event) {
  const request = event.request;
  const headers = request.headers;

  if (
    typeof headers.authorization === "undefined" ||
    typeof headers.authorization.value === "undefined"
  ) {
    return {
      statusCode: 401,
      statusDescription: "Unauthorized",
      headers: { "www-authenticate": { value: "Basic" } },
    };
  }

  const encoded = headers.authorization.value.split(" ")[1];
  const decoded = Buffer.from(encoded, "base64").toString();
  const userRequest = decoded.split(":")[0];
  const passRequest = decoded.split(":")[1];

  const exist = await kvsHandle.exists(userRequest);
  if (!exist) {
    return {
      statusCode: 401,
      statusDescription: "Unauthorized",
      headers: { "www-authenticate": { value: "Basic" } },
    };
  }

  const passStore = await kvsHandle.get(userRequest);
  if (passStore !== passRequest) {
    return {
      statusCode: 401,
      statusDescription: "Unauthorized",
      headers: { "www-authenticate": { value: "Basic" } },
    };
  }

  return request;
}
