import Player from "../logic/Player";
import { UserService } from "./UserService";

describe("User Services", () => {

    it("should create a new user", () => {
        const PLAYER_NAME: string = "newPlayerName";
        let newPlayer: Player = UserService.getInstance().createPlayer(PLAYER_NAME);
        expect(newPlayer).toHaveProperty("id");
    });

    it("should create two consecutive users with different ids", () => {
        const PLAYER_NAME1: string = "newPlayerName1";
        let newPlayer1: Player = UserService.getInstance().createPlayer(PLAYER_NAME1);

        const PLAYER_NAME2: string = "newPlayerName2";
        let newPlayer2: Player = UserService.getInstance().createPlayer(PLAYER_NAME2);

        expect(newPlayer1.id == newPlayer2.id).toEqual(false);
    });
});