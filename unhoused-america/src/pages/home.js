import { useEffect, useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import ameriQuestsLogo from '../AmeriQuests.jpg';
import submissionsImage from '../assets/home/call for submissions.webp';
import timelineImage from '../assets/home/timeline.jpg';
import mapImage from '../assets/home/map.png';

const HERO_SCROLL_DISTANCE = 180;

function ImagePlaceholder({ className, label }) {
    return <div className={`home-image-placeholder ${className}`} role="img" aria-label={label} />;
}

function SubmissionIcon({ type }) {
    return (
        <svg className="home-submission-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="29" fill="var(--highlight-yellow)" stroke="none" />
            <g transform="translate(32 32) scale(0.8) translate(-32 -32)">
            {type === 'book' && <>
                <path d="M32 19c-6-4-13-5-21-3v29c8-2 15-1 21 3 6-4 13-5 21-3V16c-8-2-15-1-21 3Z" />
                <path d="M32 19v29M17 24c3 0 6 1 9 2M17 31c3 0 6 1 9 2M38 26c3-1 6-2 9-2M38 33c3-1 6-2 9-2" />
            </>}
            {type === 'commentary' && <>
                <path d="M17 14h30a6 6 0 0 1 6 6v19a6 6 0 0 1-6 6H29L17 53v-8a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6Z" />
                <path d="M21 25h22M21 33h16" />
            </>}
            {type === 'creative' && <>
                <path d="m25 35 22-22a3 3 0 0 1 4 0l3 3a3 3 0 0 1 0 4L32 42l-11 4 4-11Z" />
                <path d="m43 17 7 7M25 35l7 7M14 39c-9 4-7 13 3 13 9 0 14-6 23-4 4 1 7 3 10 6" />
            </>}
            </g>
        </svg>
    );
}

function Home() {
    useSEO();
    const [heroProgress, setHeroProgress] = useState(0);

    useEffect(() => {
        let frame;
        let settleTimer;
        let previousScroll = window.scrollY;
        let scrollingDown = true;
        const updateHero = () => {
            const scrollY = Math.max(0, window.scrollY);
            if (scrollY !== previousScroll) {
                scrollingDown = scrollY > previousScroll;
            }
            previousScroll = scrollY;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                setHeroProgress(Math.min(1, Math.max(0, window.scrollY / HERO_SCROLL_DISTANCE)));
            });
            clearTimeout(settleTimer);
            // Complete the transition after scrolling pauses; leave the rest of the page free to scroll.
            if (scrollY > 0 && scrollY < HERO_SCROLL_DISTANCE) {
                settleTimer = setTimeout(() => {
                    window.scrollTo({
                        top: scrollingDown ? HERO_SCROLL_DISTANCE : 0,
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                    });
                }, 140);
            }
        };
        updateHero();
        window.addEventListener('scroll', updateHero, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateHero);
            cancelAnimationFrame(frame);
            clearTimeout(settleTimer);
        };
    }, []);

    const returnToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTitleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            returnToTop();
        }
    };

    return (
        <main className="main-content home" style={{ '--hero-progress': heroProgress, '--hero-scroll-distance': `${HERO_SCROLL_DISTANCE}px` }}>
            <section className="home-hero" aria-labelledby="home-title">
                <div className="home-hero-disc" aria-hidden="true" />
                <div className="home-return-to-top" aria-hidden="true" onClick={returnToTop} />
                <a className="home-publication" href="https://www.ameriquests.org" target="_blank" rel="noopener noreferrer">
                    <svg className="home-publication-logo" viewBox="0 0 600 100" role="img" aria-label="AmeriQuests">
                        <defs>
                            <filter id="ameriquests-purple-mask" colorInterpolationFilters="sRGB">
                                <feColorMatrix
                                    in="SourceGraphic"
                                    type="matrix"
                                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.3333 -0.3333 -0.3333 0 1"
                                    result="letterMask"
                                />
                                <feFlood floodColor="#392F67" result="titlePurple" />
                                <feComposite in="titlePurple" in2="letterMask" operator="in" />
                            </filter>
                        </defs>
                        <image href={ameriQuestsLogo} width="600" height="100" filter="url(#ameriquests-purple-mask)" />
                    </svg>
                </a>
                <div className="home-title-link" role="button" tabIndex={0} onClick={returnToTop} onKeyDown={handleTitleKeyDown}>
                    <h1 id="home-title">Unhoused<br />America</h1>
                </div>
                <p className="home-tagline">
                    A multimedia online issue of AmeriQuests to unsettle persistent, and often
                    counterproductive, stereotypes about homelessness in the United States.
                </p>
            </section>

            <span className="home-hero-scroll-space" aria-hidden="true" />

            <div className="home-section-band">
                <section className="home-submissions" aria-labelledby="submissions-title">
                    <h2 id="submissions-title">Call for Submissions</h2>
                    <div className="home-submissions-grid">
                        <figure className="home-submissions-figure">
                            <img className="home-submissions-photo" src={submissionsImage} alt="Tents and belongings beside a Sidewalk Closed sign at a Minneapolis encampment" />
                            <figcaption className="home-image-credit">
                                Source: <a href="https://www.cbsnews.com/minnesota/news/minneapolis-homeless-encampment-sabri-response/" target="_blank" rel="noopener noreferrer">CBS Minnesota / WCCO</a>
                            </figcaption>
                        </figure>
                        <div className="home-submissions-copy">
                            <h3>Overview</h3>
                            <p>
                                <i>AmeriQuests</i> is looking for text submissions for peer review, commentary, and
                                creative works for publishing in an upcoming special edition, <i>Unhoused America</i>.
                            </p>
                            <p>
                                <i>Unhoused America</i> is a multimedia special issue developed with MIT&apos;s Knowledge
                                Futures Group. We welcome submissions that engage homelessness through research,
                                commentary, and creative practice, including work in conversation with the project&apos;s
                                interactive map, timeline, and Embodicons.
                            </p>
                            <div className="home-submission-links">
                                <a href="#core-components">Core Components</a>
                                <a href="#submission-types">Submission Types</a>
                                <a href="#submission-guidelines">Submission Guidelines</a>
                            </div>
                        </div>
                    </div>

                    <div className="home-submission-details">
                        <article id="core-components" className="home-components-detail">
                            <h3>Core Components</h3>
                            <div className="home-components-list">
                                <a className="home-component-card" href="/embodicons">
                                    <ImagePlaceholder className="home-component-image" label="Embodicons image placeholder" />
                                    <h4>Embodicons</h4>
                                    <p>Explore AI-generated composite profiles that illuminate the diverse, everyday experiences of people navigating homelessness.</p>
                                </a>
                                <a className="home-component-card" href="/map">
                                    <img className="home-component-image" src={mapImage} alt="Purple-shaded map of the United States with location markers" loading="lazy" />
                                    <h4>Interactive Geospatial Map</h4>
                                    <p>Using HUD Continuum of Care regions and 2024 point-in-time county data, <i>Unhoused America</i> maps homelessness across the US to identify regional “hot spots” and demographic disparities.</p>
                                </a>
                                <a className="home-component-card" href="/timeline">
                                    <img className="home-component-image" src={timelineImage} alt="Archival photograph of makeshift homes with an industrial city skyline behind them" loading="lazy" />
                                    <h4>Timeline</h4>
                                    <p>Situate contemporary homelessness within its broad historical, legal, and policy context, deepening understanding of its causes and consequences.</p>
                                </a>
                                <p>
                                    <strong>Interactive Geospatial Map:</strong> Using HUD Continuum of Care regions and
                                    2024 point-in-time county data, <i>Unhoused America</i> will map homelessness across
                                    the US, disaggregated by demographics to identify regional “hot spots” and thematic
                                    disparities often overlooked in other publicly available data.
                                </p>
                                <p>
                                    <strong>Timeline:</strong> This feature situates contemporary homelessness within its
                                    broad historical, legal, and policy context, deepening visitors&apos; understanding of
                                    its causes and consequences.
                                </p>
                                <p>
                                    <strong>Embodicons (AI-Generated Profiles):</strong> To approach storytelling in a
                                    trauma-responsive, non-extractive manner, <i>Unhoused America</i> synthesizes existing
                                    media and documentation of unhoused experiences to create up to five million AI-based,
                                    composite profiles that illustrate typical day-to-day experiences of unhoused individuals,
                                    including factors contributing to their homelessness—preserving dignity and avoiding
                                    overburdening vulnerable voices, while humanizing the experience. Targeted recommendations
                                    are also made for service providers within the designated metropolitan area, based on the
                                    Embodicons&apos; unique risk factors and needs.
                                </p>
                            </div>
                        </article>
                        <article id="submission-types" className="home-components-detail">
                            <h3>Submission Types</h3>
                            <div className="home-components-list">
                                <p>
                                    <SubmissionIcon type="book" />
                                    <strong>Text Submissions for Peer-Review</strong><br />
                                    Text submissions consisting of a 2,000 to 5,000-word manuscript with accompanying
                                    figures or images (visuals are encouraged) that directly engage perceptions of
                                    homelessness. We do welcome submissions that directly work in conversation with the
                                    platform&apos;s interactive geospatial map, timeline, and Embodicons. Accepted submissions
                                    will undergo a double peer review process.
                                </p>
                                <p>
                                    <SubmissionIcon type="commentary" />
                                    <strong>Text Submissions as Commentary</strong><br />
                                    Text submissions consisting of a 1,000 to 2,500-word manuscript with accompanying
                                    figures or images (visuals are encouraged) that directly engage perceptions of
                                    homelessness. We do welcome submissions that directly work in conversation with the
                                    platform&apos;s interactive geospatial map, timeline, and Embodicons. Accepted submissions
                                    will not undergo a peer review process.
                                </p>
                                <p>
                                    <SubmissionIcon type="creative" />
                                    <strong>Creative Submissions</strong><br />
                                    Creative works can include media submissions (project portfolios: visual art,
                                    performance art, design, architecture, culinary arts, among other media practices)
                                    consisting of up to 10 separate visual, audio, or video files, accompanied by textual
                                    descriptions and captions. Submissions should be accompanied by a 500- to 1,000-word
                                    text providing commentary on the work. Text is strongly encouraged for creative
                                    submissions to be considered for publication.
                                </p>
                            </div>
                        </article>
                        <article id="submission-guidelines" className="home-guidelines-detail">
                            <h3>Submission Guidelines</h3>
                            <section>
                                <h4>Editorial Review and Submission Process</h4>
                                <p>For text submissions (peer review and commentary), please discern upon submission if you intend to for peer review or not. Upon preliminary acceptance, peer-reviewed text submissions will undergo a double peer-review process. Commentary text submissions and creative submissions are not peer reviewed and will be selected at the discretion of the editorial team.</p>
                            </section>

                            <section>
                                <h4>Manuscript Preparation</h4>
                                <p>As this is an online publication, the range of possible references, hyperlinks, and internal references is as broad as the technology will support. However, expect that all citations are consistent with a singular style of language.</p>
                                <p>Contributors should send only proofread manuscripts, with correct punctuation, spelling, and citations, and images that are appropriately captioned and cited. All text documents must be written in a 12-point (size) Times New Roman double-spaced font.</p>
                                <p>If you are sending a manuscript that includes figures or images, please send each as a separate file, NOT embedded within the text document. Each visual item should be numbered, titled, and have its placement indicated within the text. Please see below for specifics on image format requirements.</p>
                            </section>

                            <div className="home-guidelines-columns">
                                <section>
                                    <h4>Text Submission Guidelines{' '}
                                        <span className="home-guideline-icons">
                                            <SubmissionIcon type="book" />
                                            <SubmissionIcon type="commentary" />
                                        </span>
                                    </h4>
                                <p>All text documents should be submitted as Microsoft Office Document (.docx) files via email to Dana McKinney White (<a href="mailto:mckinneywhite@gsd.harvard.edu">mckinneywhite@gsd.harvard.edu</a>), cc&apos;ing Robert Barsky (<a href="mailto:robert.barsky@vanderbilt.edu">robert.barsky@vanderbilt.edu</a>). Figures or images should be attached as individual, high-resolution JPG or TIFF files. When submitting, please specify whether the piece is a text submission for peer review or as a commentary.</p>
                                <p>All sources should be properly cited within the text using a consistent style of language (MLA, Chicago, APA, ABA, etc.). Please include a bibliography with your manuscript, unless you use endnotes or footnotes, in which case a separate list of works cited is not needed. Image captions should be included as a separate Microsoft Office Document (.docx) file.</p>
                                <h5>Copyright Permissions</h5>
                                <p>If your work contains borrowed images or other elements that are not of your own authorship, you must obtain the proper copyright permissions. All necessary permissions must be obtained to use copyrighted imagery, such as photographs, illustrations, tables, or drawings.</p>
                                <p>All letters of permission should accompany your manuscript in the initial submission. <i>AmeriQuests</i> will not subsidize the cost of attaining permissions for submitted work.</p>
                                <h5>Collaboration</h5>
                                <p>If more than one author has collaborated on a piece of work, each should have the opportunity to view the work before submission and throughout the editorial process. Please designate one person to handle correspondence, but include all contributors&apos; names and emails upon submission, and ensure that all parties remain informed of editorial decisions.</p>
                                <h5>AI/LLM Issues</h5>
                                <p>No LLM tool can be credited as an author on any submission. Any substantive use of LLM text-based or visual-based tools must be appropriately cited.</p>
                                    <h5>Writers&apos; Fees</h5>
                                    <p>Writers of editorial content shall not be paid for their work unless the work is especially commissioned for the Journal under special arrangement and under a separate contract.</p>
                                </section>

                                <section>
                                    <h4>Creative Submission Guidelines{' '}
                                        <span className="home-guideline-icons">
                                            <SubmissionIcon type="creative" />
                                        </span>
                                    </h4>
                                <p>All images should be submitted as individual, high-resolution JPEG, PNG, or GIF (animated only) files via email to Dana McKinney White (<a href="mailto:mckinneywhite@gsd.harvard.edu">mckinneywhite@gsd.harvard.edu</a>), cc&apos;ing Robert Barsky (<a href="mailto:robert.barsky@vanderbilt.edu">robert.barsky@vanderbilt.edu</a>). Videos should be submitted in the MP4 format. Audio files should be in the MP3 format. Ensure that the shortest edge of the submitted media is no less than 2048 pixels. If you want to submit in a different creative format, please contact us with any questions about the submission requirements. When submitting, please specify that the piece is a creative submission.</p>
                                <p>All accompanying text documents should be attached as Microsoft Office documents (.docx) files.</p>
                                <h5>Captioning</h5>
                                <p>All images should be accompanied by a written caption including the artist&apos;s name, title, date, and source credit. Captions should be included in the submission materials as a separate Microsoft Office Document (.docx) file.</p>
                                <h5>Permissions for Images</h5>
                                <p>If your work contains borrowed images or other elements that are not of your own authorship, you must obtain the proper copyright permissions. All necessary permissions must be obtained to use copyrighted imagery, such as photographs, illustrations, tables, or drawings.</p>
                                <p>All letters of permission should accompany your manuscript in the initial submission. <i>AmeriQuests</i> will not subsidize the cost of attaining permissions for submitted work.</p>
                                <h5>Collaboration</h5>
                                <p>If more than one contributor has collaborated on a piece of work, each should have the opportunity to view the work before submission and throughout the editorial process. Please designate one person to handle correspondence, but ensure that all parties remain informed of editorial decisions.</p>
                                <h5>AI/LLM Issues</h5>
                                <p>No LLM tool can be credited as an author on any submission. Any substantive use of LLM text-based or visual-based tools must be appropriately cited.</p>
                                    <h5>Artists&apos; Fees</h5>
                                    <p>Artists of creative work shall not be paid for their work, unless the work is especially commissioned for the Journal under special arrangement and under separate contract.</p>
                                </section>
                            </div>

                            <section className="home-guidelines-contact">
                                <h4>Contact Information</h4>
                                <p>Direct any questions via email to:</p>
                                <div className="home-guidelines-contact-grid">
                                    <p><strong>Dana McKinney White</strong><br />
                                        <i>Unhoused America</i> Special Edition Editor<br />
                                        <a href="mailto:mckinneywhite@gsd.harvard.edu">mckinneywhite@gsd.harvard.edu</a>
                                    </p>
                                    <p><strong>Robert Barsky</strong><br />
                                        <i>AmeriQuests</i> Editor<br />
                                        <a href="mailto:robert.barsky@vanderbilt.edu">robert.barsky@vanderbilt.edu</a>
                                    </p>
                                </div>
                            </section>
                        </article>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Home;
