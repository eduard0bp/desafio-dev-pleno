import { Affix, Container } from '@mantine/core';
import { NotificationBell, ReviewList } from '../../components';
import classes from './ReviewsPage.module.css';

export function ReviewsPage() {
  return (
    <Container size="lg" px={0}>
      <Affix position={{ top: 8, right: 16 }} zIndex={300}>
        <div className={classes.bellOffset}>
          <NotificationBell />
        </div>
      </Affix>
      <ReviewList />
    </Container>
  );
}
