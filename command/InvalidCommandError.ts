export class InvalidCommandError extends Error {

    public name = "InvalidCommandError";

    constructor(message: string) {
        super(message);
    }

}
