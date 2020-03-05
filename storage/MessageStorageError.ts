export class MessageStorageError extends Error {

    public name = "MessageStorageError";

    constructor(message: string) {
        super(message);
    }

}
