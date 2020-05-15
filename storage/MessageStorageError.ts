import { MessageStorageManager } from "./MessageStorageManager";

export class MessageStorageError extends Error {

    public name = "QuickMessage_MessageStorageError";

    constructor(message: string) {
        super(message);
    }

}
