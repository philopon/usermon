export default function isASCII(str: string): boolean {
    return /^[\x00-\x7F]*$/.test(str);
}
