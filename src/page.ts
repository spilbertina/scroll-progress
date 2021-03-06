///<reference path="paragraph.ts"/>
///<reference path="menu.ts"/>
///<reference path="menuItem.ts"/>
namespace ScrollProgress {
    export class Page {
        private _height: number;
        private readonly _offsetY: number = 0;
        private _oldParagraph: string | null = null;
        private _curentPosition: number = 0;
        private _paragraphs: Array<Paragraph>;
        private readonly _menu: Menu;
        private readonly _onScrolled?: ProgressHendler = () => null;
        private readonly _onChanged?: StateHendler = () => null;

        constructor(
            height: number,
            cursorBody: HTMLDivElement,
            menuBody: HTMLElement,
            onScrolled?: ProgressHendler,
            onChanged?: StateHendler
        ) {
            this._height = height;
            this._onScrolled = onScrolled;
            this._onChanged = onChanged;
            this._menu = new Menu(
                cursorBody,
                Array.from(menuBody.children)
            );
            this._paragraphs = this.MapToParagraphs(this._menu.Items);

            this._menu.UpdateCursorPosition(this.Progress);
            this._onScrolled?.(this.Progress);

            window.addEventListener('scroll', () => this.Scrolling());
            window.addEventListener('resize', () => this.ReInit());
        }

        private MapToParagraphs(menyItems: Array<MenuItem>): Array<Paragraph> {
            let queryString = menyItems
                .map(link => `#${link.Id}`)
                .join(', ');

            let paragraphs = Array
                .from(document.querySelectorAll(queryString))
                .map((element, index, array) => {
                    let currentElementHeight = Math.round(element.getBoundingClientRect().top + window.pageYOffset - this._offsetY) - 3;
                    let nextElementHeight = Math.round(array[index + 1]?.getBoundingClientRect()?.top + window.pageYOffset - this._offsetY) - 3;
                    if (!nextElementHeight) nextElementHeight = this._height;

                    return new Paragraph(
                        element.getAttribute("id") as string,
                        currentElementHeight,
                        nextElementHeight - currentElementHeight,
                        element.textContent
                    );
                });
            return paragraphs;
        }

        private Scrolling() {
            this._curentPosition = window.pageYOffset;
            this._menu.UpdateCursorPosition(this.Progress);
            this._onScrolled?.(this.Progress);
        }

        private get CurrentParagraph(): Paragraph {
            let curentParagraph = this._paragraphs.find(paragraph => {
                if (this._curentPosition >= paragraph.Top &&
                    this._curentPosition <= paragraph.Top + paragraph.Height) return paragraph;
            }) ?? this._paragraphs[0];

            if (curentParagraph.Id != this._oldParagraph) {
                this._onChanged?.(curentParagraph?.Id);
                this._oldParagraph = curentParagraph.Id;
            }

            return curentParagraph;
        }

        private get Progress(): IProgress {
            let curentParagraph = this.CurrentParagraph;
            let progress = Math.round(((this._curentPosition - curentParagraph.Top) / curentParagraph.Height) * 100);
            return <IProgress>{
                id: curentParagraph.Id,
                percent: progress
            }
        }

        private ReInit() {
            this._height = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );

            this._paragraphs = this.MapToParagraphs(this._menu.Items);
            this._menu.ReInit();
            this._menu.UpdateCursorPosition(this.Progress);
            this._onScrolled?.(this.Progress);
        }
    }
}
