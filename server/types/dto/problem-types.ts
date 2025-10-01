


export enum Difficulty {
    easy = 'easy',
    medium = 'medium',
    hard = 'hard'
}

export enum ProblemType {
    array_and_string = 'array_and_string',
    two_pointers = 'two_pointers',
    sliding_window = 'sliding_window',
    stack = 'stack',
    binary_search = 'binary_search',
    linked_list = 'linked_list',
    trees = 'trees',
    tries = 'tries',
    heap = 'heap',
    backtracking = 'backtracking',
    greedy = 'greedy',
    intervals = 'intervals'
}

export enum AccessLevel {
    free = 'free',
    locked = 'locked'
}

/**
* Add a testcase to the testcase table
*/
export interface TestCaseDTO {
    input: string;
    expectedOutput: string;
    isExample: boolean;
    isHidden: boolean;
    timeLimit: number;
    memoryLimit: number;
}

/**
 * Add a problem to the problem table
 */
export interface ProblemDTO {
	title: string;
	description: string;
	hints: string[];
	explanation: string;
	examples: string[]
	unlockCost: number;
    rewardCredits: number;
    difficulty: Difficulty;
    type: ProblemType;
    accessLevel: AccessLevel;
}
