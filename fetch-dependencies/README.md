[![npm (scoped)](https://img.shields.io/npm/v/@zoltu/solidity-typescript-generator-fetch-dependencies?label=npm%20-%20%40zoltu%2Fsolidity-typescript-generator-fetch-dependencies)](@zoltu/solidity-typescript-generator-fetch-dependencies)

Dependencies for code generated with @zoltu/solidity-typescript-generator that use `fetch` under the hood.

## Usage
### Browser
```ts
import { FetchJsonRpc, FetchDependencies } from '@zoltu/solidity-typescript-generator-fetch-dependencies'
import { MyContract } from './generated/my-contract.ts'

const rpc = new FetchJsonRpc('https://my-node.example.com:8545', window.fetch.bind(window))
const fetchBrowserDependencies = new FetchDependencies(rpc)
const myContractAddress = 0xbaadf00dbaadf00dbaadf00dbaadf00dbaadf00d
const myContract = new MyContract(fetchBrowserDependencies, myContractAddress)
```
### NodeJS
```ts
import fetch from 'node-fetch'
import { FetchJsonRpc, FetchDependencies } from '@zoltu/solidity-typescript-generator-fetch-dependencies'
import { MyContract } from './generated/my-contract.ts'

const rpc = new FetchJsonRpc('https://my-node.example.com:8545', fetch)
const fetchBrowserDependencies = new FetchDependencies(rpc)
const myContractAddress = 0xbaadf00dbaadf00dbaadf00dbaadf00dbaadf00d
const myContract = new MyContract(fetchBrowserDependencies, myContractAddress)
```
