import RPCClient from "@alicloud/pop-core";
import { last } from "lodash";
import { sep } from "path";
import { logger } from "../log";
import { formatError } from "../util";

export interface AliyunAccessToken {
  UserId: string;
  Id: string;
  ExpireTime: number;
}

interface AliyunCreateTokenResponse {
  ErrMsg: string;
  Token: AliyunAccessToken;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

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
      logger.info(`${logIdentifier} Creating token...`);
      const result = await client.request<AliyunCreateTokenResponse>(
        "CreateToken",
        {}
      );
      if (result.ErrMsg !== "") {
        logger.error(
          `${logIdentifier} Failed to create token: ${result.ErrMsg}`
        );
      } else {
        logger.info(
          `${logIdentifier} Succeeded. Expire time: ${result.Token.ExpireTime}`
        );
        token = result.Token;
      }
    } catch (e) {
      logger.error(
        `${logIdentifier} Failed to create token: ${formatError(e)}`
      );
    }
  }

  return {
    async getToken() {
      const tokenExpired =
        token === null ? false : token.ExpireTime * 1000 - Date.now() < 3600000;
      if (token === null || tokenExpired) {
        if (token === null) {
          logger.info(`${logIdentifier} No existing token.`);
        } else if (tokenExpired) {
          logger.info(`${logIdentifier} Existing token expired.`);
        }
        await getToken();
        return token;
      }
      return token;
    },
  };
}
