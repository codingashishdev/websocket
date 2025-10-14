export function isValidUsername(username: string): boolean {
    return username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_]+$/.test(username);
}

export function isValidPassword(password: string): boolean{
    return password.length >= 6 && password.length <= 128
}

export function isValidMessage(message: string): boolean{
    return message.length > 0 && message.length <= 250
}