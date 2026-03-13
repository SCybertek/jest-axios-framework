import { BaseClient } from "../BaseClient";

export class PetStoreClient extends BaseClient {
    // constructor(baseURL: string) {
    //     super(baseURL);
    // }   
      constructor() {
    // Update client key pairs and base url as needed
    const baseURL = `https://petstore.swagger.io/v2`;
    const key = `special-key`;
    const secret = 'special-key';
    // const codedToken = Buffer.from(`${key}:${secret}`).toString('base64');

    super(baseURL, {
      headers: {
        Authorization: "",
        'Content-Type': 'application/json',
      },
    });
  }
}