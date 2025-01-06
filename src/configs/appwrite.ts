import { Client, Account } from 'appwrite';

export const client = new Client();

const projectId = process.env.NEXT_PUBLIC_APP_WRITE_PROJECT_ID;
if (projectId) {
  client.setEndpoint('https://cloud.appwrite.io/v1').setProject(projectId);
}

export const account = new Account(client);
export { ID } from 'appwrite';
