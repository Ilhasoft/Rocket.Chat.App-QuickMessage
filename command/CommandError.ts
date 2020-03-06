export class CommandError extends Error {

    public name = "QuickMessage_CommandError";

    constructor(message: string) {
        super(message);
    }

}
