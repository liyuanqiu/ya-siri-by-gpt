import { createAliyunAccessTokenService } from "../aliyun/access-token-service";

if (require.main === module) {
  (async () => {
    require("../init");
    const nlsTokenService = createAliyunAccessTokenService(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env.ALIYUN_NLS_TOKEN_ENDPOINT!
    );
    const token = await nlsTokenService.getToken();
    console.log(token);
  })();
}
