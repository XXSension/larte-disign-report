import { Injectable } from '@nestjs/common';
import { RequestAmoService } from 'src/request-amo/request-amo.service';
import * as fs from 'fs';

@Injectable()
export class ReportTemplateService {
  numberOfApplication: number;
  constructor(private requestAmoService: RequestAmoService) {
    this.numberOfApplication = 45;
  }

  AmountFormatting(amout: number): string {
    return amout.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  summationOfElements(array: Array<number>) {
    return array.reduce((sum, current) => sum + current, 0);
  }

  async leadsOfferController(
    eventsArray: Array<any>,
    managerId: number,
  ): Promise<object> {
    const leads = await this.requestAmoService.getLeads();
    const leadsOffer = eventsArray.filter(
      (event) =>
        event.value_after.length !== 0 &&
        event.value_after[0].hasOwnProperty('lead_status') &&
        event.created_by === managerId &&
        event.type === 'lead_status_changed' &&
        event.value_after[0].lead_status.id === 41893999 &&
        event.value_after[0].lead_status.pipeline_id === 4542283,
    );
    const arrayOfSentKP = [];
    for (const lead of leads) {
      for (const event of leadsOffer) {
        if (lead.id === event.entity_id) {
          arrayOfSentKP.push(lead);
        }
      }
    }
    return {
      count: arrayOfSentKP.length,
      sum: this.summationOfElements(arrayOfSentKP.map((lead) => lead.price)),
    };
  }

  async ManagersReportTemplate(managers: Array<string>): Promise<string> {
    const [
      newTask,
      priceAnnouced,
      invoiceIssued,
      advancePaymentReceived,
      successfullyImplemented,
      takenToWork,
    ] = await Promise.all([
      this.requestAmoService.getLead(),
      this.requestAmoService.priceAnnouced(),
      this.requestAmoService.invoiceIssued(),
      this.requestAmoService.advancePaymentReceived(),
      this.requestAmoService.successfullyImplemented(),
      this.requestAmoService.takenToWork(),
    ]);
    const arrayManagers = [];
    const arrayManagersSNG = [8983862, 8983870];
    const arrayManagersWorld = [8983842, 8983854, 8983866];

    for (const manager of managers) {
      let template = '';
      template += `<strong>${manager}</strong> \n`;
      if (manager === 'Отдел продаж РФ') {
        template += this.lineCreation(
          'Новых сделок',
          newTask.filter(
            (event) =>
              arrayManagersSNG.indexOf(event.created_by) !== -1 &&
              event.status_id === 53017106,
          ).length,
        );
        template += this.lineCreation(
          'Взято в работу сделок',
          takenToWork.filter(
            (task) => arrayManagersSNG.indexOf(task.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Кол-во перешедших в «Цена озвучена»',
          priceAnnouced.filter(
            (event) => arrayManagersSNG.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Сумма бюджетов перешедших в «Цена озвучена»',
          this.budgetAmount(newTask, arrayManagersSNG, priceAnnouced),
        );
        template += this.lineCreation(
          'Перешедших в «Счет выставлен»',
          invoiceIssued.filter(
            (event) => arrayManagersSNG.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Перешедших в «Предоплата получена»',
          advancePaymentReceived.filter(
            (event) => arrayManagersSNG.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Перешедших в «Успех»',
          successfullyImplemented.filter(
            (event) => arrayManagersSNG.indexOf(event.created_by) !== -1,
          ).length,
        );
      } else if (manager === 'Отдел продаж Мир') {
        template += this.lineCreation(
          'Новых сделок',
          newTask.filter(
            (event) =>
              arrayManagersWorld.indexOf(event.created_by) !== -1 &&
              event.status_id === 53017106,
          ).length,
        );
        template += this.lineCreation(
          'Взято в работу сделок',
          newTask.filter(
            (task) =>
              arrayManagersWorld.indexOf(task.created_by) !== -1 &&
              task.status_id === 53017114,
          ).length,
        );
        template += this.lineCreation(
          'Кол-во перешедших в «Цена озвучена»',
          priceAnnouced.filter(
            (event) => arrayManagersWorld.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Сумма бюджетов перешедших в «Цена озвучена»',
          this.budgetAmount(newTask, arrayManagersWorld, priceAnnouced),
        );
        template += this.lineCreation(
          'Перешедших в «Счет выставлен»',
          invoiceIssued.filter(
            (event) => arrayManagersWorld.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Перешедших в «Предоплата получена»',
          advancePaymentReceived.filter(
            (event) => arrayManagersWorld.indexOf(event.created_by) !== -1,
          ).length,
        );
        template += this.lineCreation(
          'Перешедших в «Успех»',
          successfullyImplemented.filter(
            (event) => arrayManagersWorld.indexOf(event.created_by) !== -1,
          ).length,
        );
      }

      arrayManagers.push(template);
    }

    return arrayManagers.join('\n------------------\n\n');
  }
  lineCreation(text: string, essence: any) {
    if (text === 'Сумма бюджетов перешедших в «Цена озвучена»') {
      return `${text}: ${essence} рублей\n`;
    }
    return `${text}: ${essence}\n`;
  }

  counterDates(remainder: number): number {
    const Application = fs.readFileSync('dist/logs/numberOfapplications.txt');
    if (new Date().getDate() === 1) {
      fs.writeFileSync('dist/logs/numberOfapplications.txt', '45');
    } else {
      fs.writeFileSync(
        'dist/logs/numberOfapplications.txt',
        String(Number(Application) - remainder),
      );
    }
    return Number(Application) - remainder;
  }
  async managersAccepted(): Promise<number> {
    const managersEvent = await this.requestAmoService.countApplication();
    const acceptedManagers = await this.requestAmoService.countAmoCrm();
    return this.filtersAccepter(managersEvent, acceptedManagers);
  }
  filtersAccepter(
    managersEvent: Array<number>,
    acceptedManagers: Array<any>,
  ): number {
    return acceptedManagers.filter(
      (event) => managersEvent.indexOf(event.entity_id) !== -1,
    ).length;
  }

  async getLead() {
    await this.requestAmoService.getLeads();
  }

  //Счет суммы бюджета
  budgetAmount(arrayLeads: Array<any>, array, arrayAdvancePayment: Array<any>) {
    let counter = 0;
    if (arrayLeads.length === 0) {
      return 0;
    }

    // return 0;
    arrayLeads.forEach((e) => {
      for (const event of arrayAdvancePayment) {
        if (
          array.indexOf(e.created_by) !== -1 &&
          event.value_after.lead_status.id === e.id
        ) {
          counter += e.price;
        }
      }
    });
    return counter;
  }
}
