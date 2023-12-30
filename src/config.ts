export interface Config {
    learn?: { //when variation is unsee 
        by?: "depth" | "breadth", //how we find the next variation
        max?: number //dont look at variations after this many moves 
    }
    recall?: { //after a variation has already been seen
        by?: "depth" | "breadth",
        max?: number
    }
    buckets?: number[] //the "spaces" for spaced repetition. see "leitner system"
    promotion?: "most" | "next"
    demotion?: "most" | "next"
}