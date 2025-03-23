import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

export interface Event {
    name: string;
    value: any;
}

@Injectable({
    providedIn: 'root',
})
export class EventService {
    private events: Subject<Event> = new Subject();

    constructor() {}

    push(name: string, value: any) {
        this.events.next({name, value});
    }

    getObservable() {
        return this.events.asObservable();
    }

    destroy() {
        this.events.complete();
    }
}