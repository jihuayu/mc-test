"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const varint_1 = require("./varint");
const V_1_15 = 550; // 19w34a
const V_1_14 = 477;
const V_1_13 = 393;
exports.getPacketIdMap = (v) => ({
    keepAliveC: v < V_1_15 ? v < V_1_14 ? v < V_1_13 ? 0x1f : 0x21 : 0x20 : 0x21,
    keepAliveS: v < V_1_14 ? v < V_1_13 ? 0xb : 0xe : 0xf
});
class PacketReader {
    constructor(buffer, protocol = 304) {
        this.buffer = buffer;
        this.protocol = protocol;
        this.offset = 0;
        this.id = this.readVarInt();
    }
    clone() {
        return new PacketReader(this.buffer, this.protocol);
    }
    read(length) {
        return this.buffer.slice(this.offset, this.offset += length);
    }
    readString() {
        return this.read(this.readVarInt()).toString();
    }
    readJSON() {
        return JSON.parse(this.readString());
    }
    readBool() {
        return Boolean(this.readUInt8());
    }
    readInt8() {
        return this.buffer.readInt8((this.offset += 1) - 1);
    }
    readUInt8() {
        return this.buffer.readUInt8((this.offset += 1) - 1);
    }
    readInt16() {
        return this.buffer.readInt16BE((this.offset += 2) - 2);
    }
    readUInt16() {
        return this.buffer.readUInt16BE((this.offset += 2) - 2);
    }
    readInt32() {
        return this.buffer.readInt32BE((this.offset += 4) - 4);
    }
    readUInt32() {
        return this.buffer.readUInt32BE((this.offset += 4) - 4);
    }
    readInt64() {
        return BigInt.asIntN(64, this.readUInt64());
    }
    readUInt64() {
        const first = BigInt(this.readUInt32());
        const last = BigInt(this.readUInt32());
        return (first << 32n) + last;
    }
    readFloat() {
        return this.buffer.readFloatBE((this.offset += 4) - 4);
    }
    readDouble() {
        return this.buffer.readDoubleBE((this.offset += 8) - 8);
    }
    readVarInt() {
        const [result, offset] = varint_1.decodeVarInt(this.buffer, this.offset);
        return (this.offset = offset, result);
    }
    readVarLong() {
        const [result, offset] = varint_1.decodeVarLong(this.buffer, this.offset);
        return (this.offset = offset, result);
    }
    readPosition() {
        const value = this.readUInt64();
        return this.protocol < 440
            ? {
                x: Number(value >> 38n) << 6 >> 6,
                y: Number((value >> 26n) & 0xfffn) << 20 >> 20,
                z: Number(value & 0x3ffffffn) << 6 >> 6
            } : {
            x: Number(value >> 38n) << 6 >> 6,
            y: Number(value & 0xfffn) << 20 >> 20,
            z: Number((value >> 12n) & 0x3ffffffn) << 6 >> 6
        };
    }
}
exports.PacketReader = PacketReader;
class PacketWriter {
    constructor(id, protocol = 404) {
        this.id = id;
        this.protocol = protocol;
        this.buffer = Buffer.alloc(8);
        this.offset = 0;
        this.writeVarInt(id);
    }
    extend(len) {
        while (this.offset + len > this.buffer.length) {
            this.buffer = Buffer.concat([this.buffer, Buffer.alloc(this.buffer.length)]);
        }
    }
    write(buffer) {
        this.extend(buffer.length);
        buffer.copy(this.buffer, this.offset);
        this.offset += buffer.length;
        return this;
    }
    writeString(string) {
        const buffer = Buffer.from(string);
        this.writeVarInt(buffer.length).write(buffer);
        return this;
    }
    writeJSON(json) {
        return this.writeString(JSON.stringify(json));
    }
    writeBool(bool) {
        this.writeUInt8(bool ? 1 : 0);
        return this;
    }
    writeInt8(x) {
        this.extend(1);
        this.offset = this.buffer.writeInt8(x, this.offset);
        return this;
    }
    writeUInt8(x) {
        this.extend(1);
        this.offset = this.buffer.writeUInt8(x, this.offset);
        return this;
    }
    writeInt16(x) {
        this.extend(2);
        this.offset = this.buffer.writeInt16BE(x, this.offset);
        return this;
    }
    writeUInt16(x) {
        this.extend(2);
        this.offset = this.buffer.writeUInt16BE(x, this.offset);
        return this;
    }
    writeInt32(x) {
        this.extend(4);
        this.offset = this.buffer.writeInt32BE(x, this.offset);
        return this;
    }
    writeUInt32(x) {
        this.extend(4);
        this.offset = this.buffer.writeUInt32BE(x, this.offset);
        return this;
    }
    writeInt64(x) {
        return this.writeUInt64(x);
    }
    writeUInt64(x) {
        this.extend(8);
        x = BigInt.asUintN(64, x);
        this.offset = this.buffer.writeUInt32BE(Number(x >> 32n), this.offset);
        this.offset = this.buffer.writeUInt32BE(Number(x & 0xffffffffn), this.offset);
        return this;
    }
    writeFloat(x) {
        this.extend(4);
        this.offset = this.buffer.writeFloatBE(x, this.offset);
        return this;
    }
    writeDouble(x) {
        this.extend(8);
        this.offset = this.buffer.writeDoubleBE(x, this.offset);
        return this;
    }
    writeVarInt(x) {
        varint_1.writeVarInt(x, v => this.writeUInt8(v));
        return this;
    }
    writeVarLong(x) {
        varint_1.writeVarLong(x, v => this.writeUInt8(v));
        return this;
    }
    writePosition(x, y, z) {
        if (x instanceof Object)
            y = x.y, z = x.z, x = x.x;
        return this.writeUInt64(this.protocol < 440
            ? (BigInt(x & 0x3ffffff) << 38n) | (BigInt(y & 0xfff) << 26n) | BigInt(z & 0x3ffffff)
            : (BigInt(x & 0x3ffffff) << 38n) | (BigInt(z & 0x3ffffff) << 12n) | BigInt(y & 0xfff));
    }
    encode() {
        return this.buffer.slice(0, this.offset);
    }
}
exports.PacketWriter = PacketWriter;
