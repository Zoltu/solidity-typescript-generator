[![npm (scoped)](https://img.shields.io/npm/v/@zoltu/solidity-typescript-generator-browser-dependencies?label=npm%20-%20%40zoltu%2Fsolidity-typescript-generator-browser-dependencies)](@zoltu/solidity-typescript-generator-browser-dependencies)

Dependencies for code generated with @zoltu/solidity-typescript-generator that uses `window.ethereum` provider under the hood.

## Usage
### Browser
```ts
import { FetchJsonRpc, FetchDependencies } from '@zoltu/solidity-typescript-generator-fetch-dependencies'
import { BrowserDependencies } from '@zoltu/solidity-typescript-generator-browser-dependencies'
import { MyContract } from './generated/my-contract.ts'

// we use fetch to a centralized node as a fallabck if `window.ethereum` isn't available
const rpc = new FetchJsonRpc('https://my-node.example.com:8545', window.fetch.bind(window))
const fetchDependencies = new FetchDependencies(rpc)
const browserDependencies = new BrowserDependencies(fetchDependencies, {})
const myContractAddress = 0xbaadf00dbaadf00dbaadf00dbaadf00dbaadf00d
const myContract = new MyContract(browserDependencies, myContractAddress)
```
