import CategoryManager from './CategoryManager.jsx';
import { categoryConfigs } from './categoryConfigs.js';
import { useRememberedTab } from '../../../hooks/useRememberedTab.js';
import './CategoryPage.css';

const TAB_SLUGS = categoryConfigs.map(({ slug }) => slug);

const CategoryPage = () => {
  const [activeSlug, selectTab] = useRememberedTab('traveltour_admin_category_tab', TAB_SLUGS);
  const activeConfig = categoryConfigs.find(({ slug }) => slug === activeSlug);

  return (
    <>
      <h1 className="dashboard-page__title">Loại tour</h1>

      <div className="page-tabs" role="tablist" aria-label="Nhóm danh mục">
        {categoryConfigs.map(({ slug, label }) => {
          const isActive = slug === activeConfig.slug;
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              id={`category-tab-${slug}`}
              aria-selected={isActive}
              aria-controls="category-panel"
              className={`page-tabs__tab${isActive ? ' page-tabs__tab--active' : ''}`}
              onClick={() => selectTab(slug)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div id="category-panel" role="tabpanel" aria-labelledby={`category-tab-${activeConfig.slug}`}>
        {/* key theo tab để mỗi lần đổi tab, form và thông báo của tab cũ được xóa sạch */}
        <CategoryManager key={activeConfig.slug} config={activeConfig} />
      </div>
    </>
  );
};

export default CategoryPage;
