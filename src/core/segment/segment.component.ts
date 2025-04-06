import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../app/modules/shared.module';
import { ClientsPage } from '../../app/clients/clients.page';
import { EventService } from '../../app/services/event.service';


@Component({
    selector: 'app-segment',
    templateUrl: './segment.component.html',
    styleUrls: ['./segment.component.scss'],
    imports: [SharedModule]
})
export class SegmentComponent implements OnInit {
    selectedSegment: string = 'home';

    constructor(
        //public global: GlobalService,
        private route: ActivatedRoute,
        private router: Router,
        private events: EventService
    ) {
    }

    ngOnInit() {
        /*
        this.global.getObservable('routerChange').subscribe((res) => {
            if (res) {
                this.onChangeSegment({detail: {value: res}});
            }
        });
        */
        this.getRoute();
    }

    add(){
        this.events.push('add.event', true);
    }

    getRoute() {
        const firstChild = this.route.snapshot.firstChild;
        if (firstChild && firstChild.url.length > 0) {
            this.selectedSegment = firstChild.url[0].path;
        }
    }

    onChangeSegment(value: string) {
        this.selectedSegment = value;
        this.router.navigate([`/tabs/${value}`]);
    }
}
