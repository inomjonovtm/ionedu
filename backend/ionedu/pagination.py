from rest_framework.pagination import PageNumberPagination


class FlexPagination(PageNumberPagination):
    """Default pagination — supports ?page=N&page_size=M (clamped to 100)."""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
