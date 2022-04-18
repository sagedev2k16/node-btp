### Requirements:
1. Create an on-prem application to supply data.
2. Read the on-prem data using an BTP application.
3. Create access for two personas - Employee and Manager.

### Process (on-prem):
[Done] 1. Install Java (JDK 1.8_192) as a pre-requisite to work with SAP Cloud Connector.
[Done] 2. Install SAP Cloud Connector.
[Done] 3. Add the BTP sub-account in SCC.
[Done] 4. Create a Node application locally.
[Done] 5. Run the local node server.
[Done] 6. Expose the local node server resources through SCC.

### Process (BTP):
[Done] 1. Validate if cloud connector is linked with the BTP sub-account.
[Done] 2. Create destination to connect from BTP to the connected cloud connector.
[Done] 3. Check if destination is working properly (green tick).
[Done] 4. Deploy an app on BTP (node-btp).
[Done] 5. Create service instances of XSUAA, Destination and Connectivity services.
[Done] 6. Bind services instances to the app.
7. Get destination service access token.
8. Get connectivity service access token.
9. Get destination configuration (use the destination access token from step 7).
10. Call the on-prem server from BTP app.
11. Add authentication in BTP app (app-router).
12. Add authorization in BTP app (xs-security.json)
13. Establish trust between BTP and IAS.
14. Create users in IAS.
15. Assign appropriate group in IAS.
16. Map IAS group to BTP role collection.

### CI/CD:
- CI/CD providers:
    - Azure DevOps (ADO) : Build pipelines and Release pipelines
    - Jenkins
    - TravisCI
- Three pipelines (Dev, QA, Prod)
- Each pipeline is connected to a specific Git Repo Branch (e.g. Dev pipeline is connected with my dev git branch)
- Developer pushes the code in hotfix branch and creates a pull request.
- Approver will review the pull request and merge the PR with that specific branch.
- Build the code in that specific git repo branch (Create a temp artifact)
- The temp artifact is then released (deployed) to the BTP space.