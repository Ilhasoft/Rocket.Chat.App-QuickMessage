import { IUser } from "@rocket.chat/apps-engine/definition/users";

export interface IMessageData {
    id: string;
    globalRecordId?: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: IUser;
    updatedBy: IUser;
}
