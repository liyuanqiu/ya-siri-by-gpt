import RPCClient from "@alicloud/pop-core";
import { syslog } from "../log";

export interface AliyunAccessToken {
  UserId: string;
  Id: string;
  ExpireTime: number;
}

interface AliyunCreateTokenResponse {
  ErrMsg: string;
  Token: AliyunAccessToken;
}

export function createAliyunAccessTokenService(endpoint: string) {
  let token: AliyunAccessToken | null = null;

  const client = new RPCClient({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    endpoint,
    apiVersion: "2019-02-28",
  });

  async function getToken() {
    try {
      const result = await client.request<AliyunCreateTokenResponse>(
        "CreateToken",
        {}
      );
      if (result.ErrMsg !== "") {
        syslog(result.ErrMsg);
      } else {
        token = result.Token;
      }
    } catch (e) {
      syslog(`${e}`);
    }
  }

  return {
    async getToken() {
      if (process.env.NODE_ENV === "Dev") {
        return {
          UserId: "1234567890",
          Id: process.env.TESTING_ALIYUN_NLS_ACCESS_TOKEN,
          ExpireTime: 2000000000,
        };
      }
      if (token === null || token.ExpireTime * 1000 - Date.now() < 3600000) {
        await getToken();
        return token;
      }
      return token;
    },
  };
}
