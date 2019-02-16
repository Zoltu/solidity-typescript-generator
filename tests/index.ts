import { generateContractInterfaces } from 'solidity-typescript-generator'
import { Dependencies, Banana, Bytes, ParameterDescription, UInt256, Address, UInt8, Int8, Int256, UInt32, UInt40, Int32, Int40, Bytes32, Bytes16 } from './test-data/event-output';
import { expect } from 'chai'
import { ethers } from 'ethers'
import { readFile as readFileCallback } from 'fs'
import { promisify, TextEncoder } from 'util'

const readFile = promisify(readFileCallback)
describe('generateContractInterfaces', async () => {
	async function testContractGeneration(prefix: string) {
		const inputJson = await readFile(`./test-data/${prefix}-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await readFile(`./test-data/${prefix}-output.ts`, { encoding: 'utf8' })
		const result = generateContractInterfaces(input)
		expect(result).to.equal(expected)
	}

	it(`generate 1`, async () => {
		await testContractGeneration('1')
	})

	it(`generate 2`, async () => {
		await testContractGeneration('2')
	})

	it(`generate 3`, async () => {
		await testContractGeneration('3')
	})

	it(`generate 4`, async () => {
		await testContractGeneration('4')
	})

	it(`generates complex`, async () => {
		await testContractGeneration('complex')
	})

	it(`generates event`, async () => {
		await testContractGeneration('event')
	})

	it(`generates event duplicate`, async () => {
		await testContractGeneration('event-duplicate')
	})

	it(`generates small number return`, async () => {
		await testContractGeneration('small-number-return')
	})

	it(`generates unnamed return`, async () => {
		await testContractGeneration('unnamed-return')
	})

	it(`generates multiple returns`, async () => {
		await testContractGeneration('multiple-returns')
	})

	it(`errors on multiple unnamed returns`, async () => {
		const inputJson = await readFile(`./test-data/error-multiple-unnamed-returns-input.json`, { encoding: 'utf8' })
		const expected = await readFile(`./test-data/error-multiple-unnamed-returns-output.txt`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		expect(generateContractInterfaces.bind(null, input)).to.throw(expected)
	})

	it(`execute event`, async () => {
		const dependencies: Dependencies<ethers.utils.BigNumber> = {
			call: async () => new Bytes(0),
			// a: 5, b: keccak256(pancake), c: bytes(AA), d: address(FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
			submitTransaction: async () => {
				return ({ success: true, events: [ { topics: [ Bytes32.fromHexString('0x5c4cf109e00bf95f1fe07fc3173b24b6e8f94894407c6ec23c3e5fb82419a6ce'), Bytes32.fromHexString('0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437'), Bytes32.fromHexString('0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF') ], data: Bytes.fromHexString('0x000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001AA00000000000000000000000000000000000000000000000000000000000000') } ] })
			},
			isLargeInteger: (x: any): x is ethers.utils.BigNumber => isLargeInteger(x),
			encodeLargeUnsignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeUnsignedInteger(x),
			encodeLargeSignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeSignedInteger(x),
			decodeLargeUnsignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeUnsignedInteger(data),
			decodeLargeSignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeSignedInteger(data),
		}
		const banana = new Banana(dependencies, Address.fromHexString('0x0000000000000000000000000000000000000000'))
		const events = await banana.cherry()
		expect(events.length).to.equal(1)
		const decodedEvent = events[0]
		expect(decodedEvent.name).to.equal('Durian')
		const durian = decodedEvent as Banana.Durian<ethers.utils.BigNumber>
		expect(durian.parameters.a.toNumber()).to.equal(5)
		expect(durian.parameters.b.to0xString()).to.equal(ethers.utils.keccak256(new TextEncoder().encode('pancake')))
		expect(durian.parameters.c.to0xString()).to.equal('0xaa')
		expect(durian.parameters.d.to0xString()).to.equal('0xffffffffffffffffffffffffffffffffffffffff')
	})

	// useful for doing one-off testing, set to skip so it doesn't run normally
	it.skip(`sandbox`, async () => {
		const inputJson = await readFile(`./test-data/event-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await readFile(`./test-data/event-output.ts`, { encoding: 'utf8' })
		const result = generateContractInterfaces(input)
		expect(result).to.equal(expected)
	})
})

describe('encoding', async () => {
	const dependencies: Dependencies<ethers.utils.BigNumber> = {
		call: async () => new Bytes(0),
		submitTransaction: async () => { throw new Error(`not implemented`) },
		isLargeInteger: (x: any): x is ethers.utils.BigNumber => isLargeInteger(x),
		encodeLargeUnsignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeUnsignedInteger(x),
		encodeLargeSignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeSignedInteger(x),
		decodeLargeUnsignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeUnsignedInteger(data),
		decodeLargeSignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeSignedInteger(data),
	}
	const contract = new Banana<ethers.utils.BigNumber>(dependencies, new Address())

	it('true', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
		const parameters = [ true ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('false', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
		const parameters = [ false ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('uint8: 5', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint8'} ]
		const parameters = [ 5 as UInt8 ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('uint32: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint32'} ]
		const parameters = [ 2**32 - 1 as UInt32 ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('uint40: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint40'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(40).sub(1) as UInt40<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('uint256: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint256'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(256).sub(1) as UInt256<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int8: -5', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int8'} ]
		const parameters = [ -5 as Int8 ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int32: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int32'} ]
		const parameters = [ 2**31 - 1 as Int32 ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int32: min', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int32'} ]
		const parameters = [ -(2**31) as Int32 ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int40: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int40'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(39).sub(1) as Int40<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int40: min', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int40'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(39).mul(-1) as Int40<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int256: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int256'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(255).sub(1) as Int256<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('int256: min', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int256'} ]
		const parameters = [ ethers.utils.bigNumberify(2).pow(255).mul(-1) as Int256<ethers.utils.BigNumber> ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		8000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('address', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'address'} ]
		const parameters = [ Address.fromHexString('1234567890abcdef1234567890abcdef12345678') ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('string', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'string'} ]
		const parameters = [ 'hello' ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('bytes', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes'} ]
		const parameters = [ new Bytes([0xaa, 0xbb, 0xcc, 0xdd]) ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('bytes16', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes16'} ]
		const parameters = [ Bytes16.fromHexString('12345678901234567890123456789012') ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('empty tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: []} ]
		const parameters = [ {} ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = ''
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, static, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const parameters = [ {b: (2**32-1) as UInt32} ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const parameters = [ {b: 'hello'} ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, static, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }, { name: 'c', type: 'address' }]} ]
		const parameters = [ {b: (2**32-1) as UInt32, c: Address.fromHexString('1234567890abcdef1234567890abcdef12345678')} ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const parameters = [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])} ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, static, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint32[2]' } ]
		const parameters = [ [ 2**32 - 1 as UInt32, 5 as UInt32 ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const parameters = [ [ { b: 2**32 - 1 as UInt32 }, { b: 5 as UInt32 } ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[2]' } ]
		const parameters = [ [ 'hello', 'goodbye' ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, dynamic, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, static, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint32[]' } ]
		const parameters = [ [ 2**32 - 1 as UInt32, 5 as UInt32 ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, static, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const parameters = [ [ { b: 2**32 - 1 as UInt32 }, { b: 5 as UInt32 } ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('simple, dynamic, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[]' } ]
		const parameters = [ [ 'hello', 'goodbye' ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
	it('complex, dynamic, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = contract.encodeParameters(abi, parameters)
		const expected = `
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, '')
		expect(bytesToHex(encoded)).to.equal(expected)
	})
})

describe('decoding', async () => {
	const dependencies: Dependencies<ethers.utils.BigNumber> = {
		call: async () => new Bytes(0),
		submitTransaction: async () => { throw new Error(`not implemented`) },
		isLargeInteger: (x: any): x is ethers.utils.BigNumber => isLargeInteger(x),
		encodeLargeUnsignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeUnsignedInteger(x),
		encodeLargeSignedInteger: (x: ethers.utils.BigNumber): Bytes32 => encodeLargeSignedInteger(x),
		decodeLargeUnsignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeUnsignedInteger(data),
		decodeLargeSignedInteger: (data: Bytes32): ethers.utils.BigNumber => decodeLargeSignedInteger(data),
	}
	const contract = new Banana<ethers.utils.BigNumber>(dependencies, new Address())

	it('boolean true', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: true }
		expect(decoded).to.deep.equal(expected)
	})
	it('boolean false', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: false }
		expect(decoded).to.deep.equal(expected)
	})
	it('uint32: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint32'} ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: 2**32 - 1 }
		expect(decoded).to.deep.equal(expected)
	})
	it('int32: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: 2**31-1 }
		expect(decoded).to.deep.equal(expected)
	})
	it('int32: min', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: -(2**31) }
		expect(decoded).to.deep.equal(expected)
	})
	it('int32: -1', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: -1 }
		expect(decoded).to.deep.equal(expected)
	})
	it('uint256: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint256'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: ethers.utils.bigNumberify(2).pow(256).sub(1) }
		expect(decoded).to.deep.equal(expected)
	})
	it('uint40 max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint40'} ]
		const data = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: ethers.utils.bigNumberify(2).pow(40).sub(1) }
		expect(decoded).to.deep.equal(expected)
	})
	it('int40: max', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: ethers.utils.bigNumberify(2).pow(39).sub(1) }
		expect(decoded).to.deep.equal(expected)
	})
	it('int40: min', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: ethers.utils.bigNumberify(2).pow(39).mul(-1) }
		expect(decoded).to.deep.equal(expected)
	})
	it('int40: -1', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: ethers.utils.bigNumberify(-1) }
		expect(decoded).to.deep.equal(expected)
	})
	it('address', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'address'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: Address.fromHexString('1234567890abcdef1234567890abcdef12345678') }
		expect(decoded).to.deep.equal(expected)
	})
	it('string', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'string'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a:  'hello'  }
		expect(decoded).to.deep.equal(expected)
	})
	it('bytes', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: new Bytes([0xaa, 0xbb, 0xcc, 0xdd]) }
		expect(decoded).to.deep.equal(expected)
	})
	it('bytes16', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes16'} ]
		const data = Bytes.fromHexString(`
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: Bytes16.fromHexString('12345678901234567890123456789012') }
		expect(decoded).to.deep.equal(expected)
	})
	it('empty tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: []} ]
		const data = new Bytes(0)
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a:  {}  }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, static, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: {b: (2**32-1) as UInt32} }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: {b: 'hello'} }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, static, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }, { name: 'c', type: 'address' }]} ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: {b: (2**32-1) as UInt32, c: Address.fromHexString('1234567890abcdef1234567890abcdef12345678')} }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])} }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, static, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint32[2]' } ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ 2**32 - 1 as UInt32, 5 as UInt32 ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ { b: 2**32 - 1 as UInt32 }, { b: 5 as UInt32 } ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[2]' } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ 'hello', 'goodbye' ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, dynamic, fixed length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, static, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint32[]' } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ 2**32 - 1 as UInt32, 5 as UInt32 ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, static, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ { b: 2**32 - 1 as UInt32 }, { b: 5 as UInt32 } ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('simple, dynamic, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[]' } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ 'hello', 'goodbye' ] }
		expect(decoded).to.deep.equal(expected)
	})
	it('complex, dynamic, dynamic length, array', async () => {
		const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = contract.decodeParameters(abi, data)
		const expected = { a: [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
		expect(decoded).to.deep.equal(expected)
	})
})

// describe('temp', async () => {
// 	it('temp', async () => {
// 		expect(encodeSmallInteger(0).toString()).to.equal('0000000000000000000000000000000000000000000000000000000000000000')
// 		expect(encodeSmallInteger(1).toString()).to.equal('0000000000000000000000000000000000000000000000000000000000000001')
// 		expect(encodeSmallInteger(-1).toString()).to.equal('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
// 		expect(encodeSmallInteger(-2147483648).toString()).to.equal('ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000')
// 		expect(encodeSmallInteger(-2147483647).toString()).to.equal('ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000001')
// 		expect(encodeSmallInteger(2147483647).toString()).to.equal('000000000000000000000000000000000000000000000000000000007fffffff')

// 		expect(decodeSmallInteger(Bytes32.fromHexString('0000000000000000000000000000000000000000000000000000000000000000'))).to.equal(0)
// 		expect(decodeSmallInteger(Bytes32.fromHexString('0000000000000000000000000000000000000000000000000000000000000001'))).to.equal(1)
// 		expect(decodeSmallInteger(Bytes32.fromHexString('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'))).to.equal(-1)
// 		expect(decodeSmallInteger(Bytes32.fromHexString('ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000'))).to.equal(-2147483648)
// 		expect(decodeSmallInteger(Bytes32.fromHexString('ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000001'))).to.equal(-2147483647)
// 		expect(decodeSmallInteger(Bytes32.fromHexString('000000000000000000000000000000000000000000000000000000007fffffff'))).to.equal(2147483647)
// 	})
// })


// test helpers
const bytesToHex = (array: Uint8Array): string => numbersToHex(Array.from(array))
const numbersToHex = (array: Array<number>): string => array.map(x => x.toString(16).padStart(2, '0')).join('')


// dependencies needed

function isLargeInteger(x: any): x is ethers.utils.BigNumber {
	return x instanceof ethers.utils.BigNumber
}

function encodeLargeUnsignedInteger<TLargeInteger>(x: TLargeInteger): Bytes32 {
	const value = x as any as ethers.utils.BigNumber
	const result = new Bytes32()
	const stringified = ('0000000000000000000000000000000000000000000000000000000000000000' + value.toHexString().substring(2)).slice(-64)
	for (let i = 0; i < stringified.length; i += 2) {
		result[i/2] = Number.parseInt(stringified[i] + stringified[i+1], 16)
	}
	return result
}

function encodeLargeSignedInteger<TLargeInteger>(x: TLargeInteger): Bytes32 {
	const value = x as any as ethers.utils.BigNumber
	const result = new Bytes32()
	const stringified = ('0000000000000000000000000000000000000000000000000000000000000000' + value.toTwos(256).toHexString().substring(2)).slice(-64)
	for (let i = 0; i < stringified.length; i += 2) {
		result[i/2] = Number.parseInt(stringified[i] + stringified[i+1], 16)
	}
	return result
}

function decodeLargeUnsignedInteger<TLargeInteger>(data: Bytes32): TLargeInteger {
	return new ethers.utils.BigNumber(data) as unknown as TLargeInteger
}

function decodeLargeSignedInteger<TLargeInteger>(data: Bytes32): TLargeInteger {
	return new ethers.utils.BigNumber(data).fromTwos(256) as unknown as TLargeInteger
}
