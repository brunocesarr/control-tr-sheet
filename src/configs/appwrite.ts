import { Client, Account } from 'appwrite';

export const client = new Client();

const projectId = '67731fe500093a9103be';
if (projectId) {
  client.setEndpoint('https://cloud.appwrite.io/v1').setProject(projectId); // Replace with your project ID
}

export const account = new Account(client);
export { ID } from 'appwrite';
