declare module "ali-oss" {
  interface OSSOptions {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    secure?: boolean;
    endpoint?: string;
    timeout?: number;
  }

  interface PutResult {
    name: string;
    url: string;
    res: {
      status: number;
      headers: Record<string, string>;
    };
  }

  interface DeleteResult {
    res: {
      status: number;
    };
  }

  class OSS {
    constructor(options: OSSOptions);
    put(
      name: string,
      file: Buffer | string,
      options?: { mime?: string; headers?: Record<string, string> },
    ): Promise<PutResult>;
    delete(name: string): Promise<DeleteResult>;
    signatureUrl(
      name: string,
      options?: { expires?: number },
    ): Promise<string>;
  }

  export = OSS;
}
