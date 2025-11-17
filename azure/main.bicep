@description('The location to deploy the resources to.')
param location string

@description('The name of the container group to create.')
param containerGroupName string

@description('The name of the storage account to create.')
param storageAccountName string

@description('The API secret for the PDF library service.')
@secure()
param apiSecret string

@description('The API base URL for the PDF library service.')
param apiBaseUrl string

@description('The Docker image tag to deploy (e.g., latest, main, sha-abc1234).')
param imageTag string = 'latest'

@description('The port on which the PDF library service listens.')
param appPort int = 3000

@description('Create a storage account and file share to persist data for the Caddy container.')
module storageAccount './storage-account.bicep' = {
  name: toLower('deploy-storage-account-module-${storageAccountName}')
  params: {
    location: location
    storageAccountName: storageAccountName
    containerGroupName: containerGroupName
  }
}

@description('Create an ACI container group to run the PDF library and Caddy containers.')
module aci './aci.bicep' = {
  name: toLower('deploy-aci-module-${containerGroupName}')
  params: {
    location: location
    storageAccountName: storageAccountName
    containerGroupName: containerGroupName
    caddyDataFileShareName: storageAccount.outputs.caddyDataFileShareName
    apiSecret: apiSecret
    apiBaseUrl: apiBaseUrl
    appPort: appPort
    imageTag: imageTag
  }
}
