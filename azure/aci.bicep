param location string
param containerGroupName string
param storageAccountName string
param caddyDataFileShareName string

@secure()
param apiSecret string

param apiBaseUrl string

param appPort int = 3000

param imageTag string = 'latest'

var publicUrl = toLower('${containerGroupName}.${location}.azurecontainer.io')

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2024-05-01-preview' = {
  name: containerGroupName
  location: location
  properties: {
    sku: 'Standard'
    containers: [
      {
        name: '${containerGroupName}-caddy'
        properties: {
          // https://hub.docker.com/_/caddy
          image: 'docker.io/caddy:latest'
          command: [
            'caddy'
            'reverse-proxy'
            '--from'
            '${publicUrl}'
            '--to'
            'localhost:${appPort}'
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
          ports: [
            {
              protocol: 'TCP'
              port: 443
            }
            {
              protocol: 'TCP'
              port: 80
            }
          ]
          volumeMounts: [
            {
              name: caddyDataFileShareName
              mountPath: '/data'
              readOnly: false
            }
          ]
        }
      }
      {
        name: '${containerGroupName}-pdf-lib'
        properties: {
          // https://github.com/bstaeheli/restful-pdf-lib
          image: 'ghcr.io/bstaeheli/restful-pdf-lib:${imageTag}'
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
          environmentVariables: [
            {
              name: 'PORT'
              value: string(appPort)
            }
            {
              name: 'API_BASE_URL'
              value: apiBaseUrl
            }
            {
              name: 'API_SECRET'
              secureValue: apiSecret
            }
          ]
          ports: [
            {
              port: appPort
              protocol: 'TCP'
            }
          ]
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Never'
    ipAddress: {
      type: 'Public'
      dnsNameLabel: containerGroupName
      ports: [
        {
          protocol: 'TCP'
          port: 443
        }
        {
          protocol: 'TCP'
          port: 80
        }
      ]
    }
    volumes: [
      {
        name: caddyDataFileShareName
        azureFile: {
          shareName: caddyDataFileShareName
          storageAccountName: storageAccount.name
          storageAccountKey: storageAccount.listKeys().keys[0].value
          readOnly: false
        }
      }
    ]
  }
}
