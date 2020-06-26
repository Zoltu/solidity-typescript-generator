import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { IOffChainTransaction, Rpc, IJsonRpcRequest, JsonRpcMethod, IJsonRpcSuccess } from '@zoltu/ethereum-types'

export const NotEthereumBrowserErrorMessage = `Your browser does not appear to be Ethereum enabled.`

export interface BrowserDependenciesOptions {
	readonly gasLimitProvider?: (transaction: Omit<IOffChainTransaction, 'gasPrice'> & { gasPrice?: bigint }) => Promise<bigint>
	readonly gasPriceInAttoethProvider?: () => Promise<bigint>
}

export class BrowserDependencies {
	public constructor(
		private readonly fallbackDependencies?: Dependencies,
		private readonly options: BrowserDependenciesOptions = {},
	) {}

	public readonly call = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		if (!this.isEthereumBrowser() && this.fallbackDependencies !== undefined) return await this.fallbackDependencies.call(to, methodSignature, parameters, value)
		if (!this.isEthereumBrowser()) throw new Error(NotEthereumBrowserErrorMessage)

		const from = await this.getPrimaryAccount() || 0n
		const data = await encodeMethod(keccak256.hash, methodSignature, parameters)
		const gasPrice = (this.options.gasPriceInAttoethProvider !== undefined) ? await this.options.gasPriceInAttoethProvider() : await this.ethGasPrice()
		return await this.ethCall({ from, to, data, value, gasLimit: null, gasPrice })
	}

	public readonly submitTransaction = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<TransactionReceipt> => {
		if (!this.isEthereumBrowser() && this.fallbackDependencies !== undefined) return await this.fallbackDependencies.submitTransaction(to, methodSignature, parameters, value)
		if (!this.isEthereumBrowser()) throw new Error(NotEthereumBrowserErrorMessage)

		const from = await this.getPrimaryAccount() || 0n
		const data = await encodeMethod(keccak256.hash, methodSignature, parameters)
		const gasPrice = (this.options.gasPriceInAttoethProvider !== undefined) ? await this.options.gasPriceInAttoethProvider() : await this.ethGasPrice()

		const gasEstimatingTransaction = { from, to, value, data, gasLimit: null, gasPrice }
		const gasLimit = this.options.gasLimitProvider !== undefined ? await this.options.gasLimitProvider(gasEstimatingTransaction) : await this.ethEstimateGas(gasEstimatingTransaction)
		const nonce = await this.ethGetTransactionCount(from)
		const unsignedTransaction = { ...gasEstimatingTransaction, gasLimit, nonce }
		const transactionHash = await this.ethSendTransaction(unsignedTransaction)
		let receipt = await this.ethGetTransactionReceipt(transactionHash)
		while (receipt === null || receipt.blockNumber === null) {
			await sleep(1000)
			receipt = await this.ethGetTransactionReceipt(transactionHash)
		}
		if (!receipt.status) throw new Error(`Transaction mined, but failed.`)
		return receipt
	}

	private readonly request = async (method: string, params: unknown) => {
		if (window.ethereum === undefined) throw new Error(NotEthereumBrowserErrorMessage)
		if ('request' in window.ethereum) {
			return await window.ethereum.request({ method, params })
		} else if ('sendAsync' in window.ethereum) {
			if (params !== undefined && !Array.isArray(params)) throw new Error(`Legacy Ethereum browsers do not support non-array RPC parameters.  ${JSON.stringify(params)}`)
			// we capture window.ethereum here to retain type narrowing since TS doesn't understand that the Promise callback function is executed immediately
			const ethereum = window.ethereum
			return new Promise((resolve, reject) => {
				ethereum.sendAsync({ jsonrpc: '2.0', id: 0, method, params: params || [] }, (error, response) => {
					if (error) return reject(unknownErrorToJsonRpcError(error, { request: { method, params } }))
					if (!isJsonRpcLike(response)) return reject(new Error(NotEthereumBrowserErrorMessage))
					if ('error' in response && response.error !== null && response.error !== undefined) return reject(unknownErrorToJsonRpcError(response.error, { request: { method, params } }))
					if ('result' in response) return resolve(response.result)
					return reject(new Error(`Unexpected response from JSON-RPC: ${JSON.stringify(response)}`))
				})
			})
		} else {
			throw new Error(NotEthereumBrowserErrorMessage)
		}
	}

	private readonly isEthereumBrowser = () => {
		if (window.ethereum !== undefined) return true
		if (window.web3 !== undefined) return true
		return false
	}

	private readonly getPrimaryAccount = async (): Promise<bigint | undefined> => {
		const accounts = await this.ethAccounts()
		return (accounts.length === 0) ? undefined : accounts[0]
	}

	private readonly makeRequest = <
		// https://github.com/microsoft/TypeScript/issues/32976 TRequestConstructor should be constrained to constructors that take a string|number|null first parameter
		TRequestConstructor extends new (...args: any[]) => { wireEncode: () => IJsonRpcRequest<JsonRpcMethod, unknown[]> },
		TResponseConstructor extends new (rawResponse: IJsonRpcSuccess<any>) => { result: unknown },
		TRequest extends InstanceType<TRequestConstructor>,
		TResponse extends InstanceType<TResponseConstructor>,
		TResponseResult extends ResultType<TResponse>,
	>(Request: TRequestConstructor, Response: TResponseConstructor) => async (...args: DropFirst<ConstructorParameters<TRequestConstructor>>): Promise<TResponseResult> => {
		const request = new Request(0, ...args) as TRequest
		const rawRequest = request.wireEncode() as RawRequestType<TRequest>
		const rawResponse = await this.request(rawRequest.method, rawRequest.params) as PickFirst<ConstructorParameters<TResponseConstructor>>
		const response = new Response({jsonrpc: '2.0', id: rawRequest.id, result: rawResponse}) as TResponse
		return response.result as TResponseResult
	}
	private readonly ethAccounts = this.makeRequest(Rpc.Eth.Accounts.Request, Rpc.Eth.Accounts.Response)
	private readonly ethCall = this.makeRequest(Rpc.Eth.Call.Request, Rpc.Eth.Call.Response)
	private readonly ethEstimateGas = this.makeRequest(Rpc.Eth.EstimateGas.Request, Rpc.Eth.EstimateGas.Response)
	private readonly ethGasPrice = this.makeRequest(Rpc.Eth.GasPrice.Request, Rpc.Eth.GasPrice.Response)
	private readonly ethGetTransactionReceipt = this.makeRequest(Rpc.Eth.GetTransactionReceipt.Request, Rpc.Eth.GetTransactionReceipt.Response)
	private readonly ethGetTransactionCount = this.makeRequest(Rpc.Eth.GetTransactionCount.Request, Rpc.Eth.GetTransactionCount.Response)
	private readonly ethSendTransaction = this.makeRequest(Rpc.Eth.SendTransaction.Request, Rpc.Eth.SendTransaction.Response)
}


/*
Helpers
 */

function sleep(delayInMilliseconds: number) {
	return new Promise<void>(resolve => setTimeout(resolve, delayInMilliseconds))
}

function isJsonRpcLike(maybe: unknown): maybe is { result: unknown } | { error: unknown} {
	return typeof maybe === 'object' && maybe !== null && ('result' in maybe || 'error' in maybe)
}

function mergeIn(target: object, source: object) {
	for (const key in source) {
		const targetValue = (target as any)[key] as unknown
		const sourceValue = (source as any)[key] as unknown
		if (targetValue === undefined || targetValue === null) {
			;(target as any)[key] = sourceValue
		} else if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
			mergeIn(targetValue, sourceValue)
		} else {
			// drop source[key], don't want to override the target value
		}
	}
	return target
}

function isPlainObject(maybe: unknown): maybe is object {
	if (typeof maybe !== 'object') return false
	if (maybe === null) return false
	if (Array.isArray(maybe)) return false
	// classes can get complicated so don't try to merge them.  What does it mean to merge two Promises or two Dates?
	if (Object.getPrototypeOf(maybe) !== Object.prototype) return false
	return true
}

function isJsonRpcErrorPayload(maybe: unknown): maybe is { code: number, message: string, data?: unknown } {
	if (typeof maybe !== 'object') return false
	if (maybe === null) return false
	return 'code' in maybe && 'message' in maybe
}

function unknownErrorToJsonRpcError(error: unknown, extraData: object) {
	if (error instanceof Error) {
		const mutableError = error as unknown as Record<'code' | 'data', unknown>
		mutableError.code = mutableError.code || -32603
		mutableError.data = mutableError.data || extraData
		if (isPlainObject(mutableError.data)) mergeIn(mutableError.data, extraData)
		return error
	}
	if (isJsonRpcErrorPayload(error)) {
		const data = isPlainObject(error.data) ? mergeIn(error.data, extraData) : error.data
		return new JsonRpcError(error.code, error.message, data)
	}
	// if someone threw something besides an Error, wrap it up in an error
	return new JsonRpcError(-32603, `Unexpected thrown value.`, mergeIn({ error }, extraData))
}

export class JsonRpcError extends Error {
	constructor(public readonly code: number, message: string, public readonly data?: unknown) {
		super(message)
		this.name = this.constructor.name
	}
}


/*
Expected shape of window.ethereum or window.web3
 */

declare global {
	interface Ethereum1193 {
		request(options: { readonly method: string, readonly params?: unknown }): Promise<unknown>
	}
	interface EthereumLegacy {
		sendAsync(options: { jsonrpc: '2.0', id: number | string | null, method: string, params: readonly unknown[] }, callback: (error: unknown, response: unknown) => void): void
	}
	interface EthereumEnableable {
		enable(): Promise<readonly string[]>
	}
	interface Window {
		ethereum?: (Ethereum1193 | EthereumLegacy) & ({} | EthereumEnableable)
		web3?: { currentProvider: EthereumLegacy }
	}
}


/*
These are copied from the generator output.
 */

 export interface Log {
	readonly topics: ReadonlyArray<bigint>
	readonly data: Uint8Array
}
export interface TransactionReceipt {
	readonly status: boolean
	readonly logs: Iterable<Log>
}
export interface Dependencies {
	call(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array>
	submitTransaction(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt>
}


/*
Type helpers
 */

 type DropFirst<T extends any[]> = ((...t: T) => void) extends ((x: any, ...u: infer U) => void) ? U : never
type PickFirst<T extends any[]> = ((...t: T) => void) extends ((x: infer U, ...u: any[]) => void) ? U : never
type ResultType<T extends { result: unknown }> = T extends { result: infer R } ? R : never
type RawRequestType<T extends { wireEncode: () => IJsonRpcRequest<JsonRpcMethod, unknown[]> }> = T extends { wireEncode: () => infer R } ? R : never
