import { Equals } from "class-validator";

export class DeleteAccountDto {
  @Equals("DELETE_MY_TRIGGERLY_DATA")
  confirmation!: string;
}
