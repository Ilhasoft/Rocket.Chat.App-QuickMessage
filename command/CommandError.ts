export class CommandError extends Error {

    public name = "QuickMessageCommandError";

    constructor(message: string) {
        super(message);
    }

}
