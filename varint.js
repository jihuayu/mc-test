"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function readVarInt(readByte) {
    let numRead = 0, result = 0, byte = 0, value;
    do {
        byte = await readByte(), value = (byte & 0b01111111);
        result |= value << (7 * numRead), numRead++;
        if (numRead > 5)
            throw new Error("Varint too big!");
    } while ((byte & 0b10000000) != 0);
    return result;
}
exports.readVarInt = readVarInt;
function decodeVarInt(buf, off = 0) {
    let numRead = 0, result = 0, byte = 0, value;
    do {
        byte = buf.readUInt8(off), off++, value = (byte & 0b01111111);
        result |= value << (7 * numRead), numRead++;
        if (numRead > 5)
            throw new Error("Varint too big!");
    } while ((byte & 0b10000000) != 0);
    return [result, off];
}
exports.decodeVarInt = decodeVarInt;
function writeVarInt(value, writeByte) {
    do {
        let temp = value & 0b01111111;
        value >>>= 7;
        if (value != 0)
            temp |= 0b10000000;
        writeByte(temp);
    } while (value != 0);
}
exports.writeVarInt = writeVarInt;
function encodeVarInt(value) {
    let bytes = [];
    do {
        let temp = value & 0b01111111;
        value >>>= 7;
        if (value != 0)
            temp |= 0b10000000;
        bytes.push(temp);
    } while (value != 0);
    return Buffer.from(bytes);
}
exports.encodeVarInt = encodeVarInt;
function decodeVarLong(buf, off = 0) {
    let numRead = 0n, result = 0n, byte = 0n, value;
    do {
        byte = BigInt(buf.readUInt8(off)), off++, value = (byte & 127n);
        result |= value << (7n * numRead), numRead++;
        if (numRead > 10)
            throw new Error("Varint too big!");
    } while ((byte & 128n) != 0n);
    return [result, off];
}
exports.decodeVarLong = decodeVarLong;
function writeVarLong(value, writeByte) {
    value = BigInt.asUintN(64, value);
    do {
        let temp = value & 127n;
        value >>= 7n;
        if (value != 0n)
            temp |= 128n;
        writeByte(Number(temp));
    } while (value != 0n);
}
exports.writeVarLong = writeVarLong;
