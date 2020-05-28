import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'

export { FetchJsonRpc }

export class FetchDependencies implements Dependencies {
	public constructor(public readonly rpc: FetchJsonRpc) { }

	public readonly call = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		return await this.rpc.offChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value })
	}

	public readonly submitTransaction = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<TransactionReceipt> => {
		return await this.rpc.onChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value })
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
